import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";

// get student from incident
export const getIncidents = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ message: "studentId is required" });

    const incidents = await Incident.find({ studentId }).sort({ date: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//create a new incident
export const createIncident = async (req, res) => {
  try {
    const { studentId, title, date, category, action, level } = req.body;
    if (!studentId || !title) return res.status(400).json({ message: "studentId and title required" });

    const incident = await Incident.create({ studentId, title, date, category, action, level });

    // update student's totalIncidents and riskLevel
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

// delete an incident
export const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    // update student summary
    const totalIncidents = await Incident.countDocuments({ studentId: incident.studentId });
    let riskLevel = "Low";
    const highCount = await Incident.countDocuments({ studentId: incident.studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId: incident.studentId, level: "Medium" });
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(incident.studentId, { totalIncidents, riskLevel });

    res.json({ message: "Incident deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
