import Intervention from "../models/interventionModel.js";
import Incident from "../models/incidentModel.js";

/* ================= CREATE INTERVENTION ================= */
export const createIntervention = async (req, res) => {
  try {
    const { studentId, type, description, interventionBy,
    approvedBy} = req.body;

    const incident = await Incident.findOne({ studentId });

    if (!incident) {
      return res.status(404).json({
        message: "No incident found for this student",
      });
    }

    const adminName =
      interventionBy ||
      req.user?.name ||
      "Admin";


    const intervention = await Intervention.create({
      studentId,
      incidentId: incident._id,

      type,
      description,

      status: "active",

      createdBy: req.userId,

      interventionBy: adminName,

      approvedBy:
        approvedBy || adminName,

      auditLogs: [
        {
          action: "Intervention Created",
          note: description,
          by: adminName,
          createdAt: new Date(),
        },
      ],
    });


    res.status(201).json(intervention);

  } catch (err) {
    console.error("createIntervention error:", err);
    res.status(500).json({ message: err.message });
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

    const intervention =
      await Intervention.findById(id);

    if (!intervention) {
      return res.status(404).json({
        message: "Intervention not found",
      });
    }

    intervention.status = "completed";

    intervention.completedBy =
      completedBy ||
      req.user?.name ||
      "Guidance Admin";

    intervention.auditLogs.push({
      action: "Intervention Completed",
      note: "Marked as completed",
      by:
        completedBy ||
        req.user?.name ||
        "Guidance Admin",
        createdAt: new Date(),
    });

    await intervention.save();

    res.json(intervention);

  } catch (err) {
    console.error(
      "resolveIntervention error:",
      err
    );

    res.status(500).json({
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