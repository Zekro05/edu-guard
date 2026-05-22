import express from "express";
import {
  createCase,
  getCases,
  updateCase,
  escalateCase,
} from "../controllers/caseController.js";

const router = express.Router();

router.get("/", getCases);
router.post("/", createCase);
router.put("/:id", updateCase);
router.post("/:id/escalate", escalateCase);

export default router;