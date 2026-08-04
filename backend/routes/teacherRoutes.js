import express from "express";
import {
  createTeacherReport,
  getTeacherReports,
  getTeacherByEmployeeId,
} from "../controllers/teacherController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/:employeeId", verifyToken, getTeacherByEmployeeId);

/* ================= CREATE REPORT ================= */
router.post("/", verifyToken, createTeacherReport);

/* ================= GET MY REPORT HISTORY ================= */
router.get("/my", verifyToken, getTeacherReports);

export default router;