import express from "express";
import { getIncidents, createIncident, deleteIncident } from "../controllers/incidentController.js";

const router = express.Router();

// GET /api/incidents?studentId=xxx
router.get("/", getIncidents);

// POST /api/incidents
router.post("/", createIncident);

// DELETE /api/incidents/:id
router.delete("/:id", deleteIncident);

export default router;
