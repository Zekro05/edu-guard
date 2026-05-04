import express from "express";
import {
  createIntervention,
  getInterventions,
  getStudentInterventions,
  resolveIntervention,
  deleteIntervention,
} from "../controllers/interventionController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* ================= ROUTES ================= */

// Create intervention
router.post("/", verifyToken, createIntervention);

// Get all interventions
router.get("/", verifyToken, getInterventions);

// Get interventions by student
router.get("/student/:studentId", verifyToken, getStudentInterventions);

// Resolve intervention
router.put("/:id/resolve", verifyToken, resolveIntervention);

// Delete intervention
router.delete("/:id", verifyToken, deleteIntervention);

export default router;