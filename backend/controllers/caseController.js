import Case from "../models/Case.js";
import Intervention from "../models/interventionModel.js";

/* CREATE CASE */
export const createCase = async (req, res) => {
  try {
    const newCase = await Case.create(req.body);
    res.status(201).json(newCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL CASES */
export const getCases = async (req, res) => {
  try {
    const cases = await Case.find().populate("studentId");
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE CASE (REVIEW) */
export const updateCase = async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ESCALATE TO INTERVENTION */
export const escalateCase = async (req, res) => {
  try {
    const c = await Case.findById(req.params.id);

    if (!c) return res.status(404).json({ message: "Case not found" });

    const intervention = await Intervention.create({
      studentId: c.studentId,
      type: c.recommendation,
      description: c.notes,
      status: "active",
    });

    c.status = "escalated";
    await c.save();

    res.json({ case: c, intervention });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};