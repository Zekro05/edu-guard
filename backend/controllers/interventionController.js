import Intervention from "../models/interventionModel.js";
import Incident from "../models/incidentModel.js";

/* ================= CREATE INTERVENTION ================= */
export const createIntervention = async (req, res) => {
  try {
    const { studentId, type, description } = req.body;

    const incident = await Incident.findOne({ studentId });

    if (!incident) {
      return res.status(404).json({
        message: "No incident found for this student",
      });
    }

    const intervention = await Intervention.create({
      studentId,
      incidentId: incident._id,
      type,
      description,
      createdBy: req.userId,
    });

    res.status(201).json(intervention);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL INTERVENTIONS ================= */
export const getInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .populate("studentId", "name")
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

    const updated = await Intervention.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Intervention not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
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