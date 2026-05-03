import express from "express";
import { getIncidents, createIncident, deleteIncident } from "../controllers/incidentController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/incidents?studentId=xxx
router.get("/",verifyToken, getIncidents);

// POST /api/incidents
router.post("/", verifyToken, createIncident);

// DELETE /api/incidents/:id
router.delete("/:id", verifyToken, deleteIncident);

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("studentId", "name grade");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
