import express from "express";

import {
  getResearchReferences,
} from "../controllers/researchReferenceController.js";

const router = express.Router();

router.get(
  "/",
  getResearchReferences,
);

export default router;