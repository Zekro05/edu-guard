import express from "express";
import {
  getIncidents,
  createIncident,
  deleteIncident,
  getIncidentById,
  getIncidentsByStudent,
  completeIncident,
  requestStudentStatement,
  submitStudentStatement,
  manualStudentStatement
} from "../controllers/incidentController.js";

import { updateIncidentStatus } from "../controllers/incidentController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* ================= IMPORTANT ORDER ================= */

// specific routes FIRST
router.get("/student/:id", verifyToken, getIncidentsByStudent);

router.put("/:id/complete", verifyToken, completeIncident);

router.put("/:id/request-statement", verifyToken, requestStudentStatement);

router.put("/:id/student-statement", verifyToken, submitStudentStatement);

router.put("/:id/manual-statement", verifyToken, manualStudentStatement);

router.put("/:id/status", verifyToken, updateIncidentStatus);

router.delete("/:id", verifyToken, deleteIncident);

// main list
router.get("/", verifyToken, getIncidents);

// create
router.post("/", verifyToken, createIncident);

// last
router.get("/:id", verifyToken, getIncidentById);

export default router;