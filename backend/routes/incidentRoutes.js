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

export default router;
