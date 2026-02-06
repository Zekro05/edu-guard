import express from "express";
import { getReportsByType, createReport, deleteReport } from "../controllers/reportController.js";
import { verifyToken } from "../middleware/verifyToken.js"; 

const router = express.Router();

router.get("/:type", verifyToken, getReportsByType);
router.post("/", verifyToken, createReport);
router.delete("/:id", verifyToken, deleteReport);

export default router;
