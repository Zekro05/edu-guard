import express from "express";
import {
  createTeacherReport,
  getTeacherReports,
  getTeacherById,
  updateMyTeacherProfile
} from "../controllers/teacherController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.put("/profile", verifyToken, updateMyTeacherProfile);

router.post("/", verifyToken, createTeacherReport);

router.get("/my", verifyToken, getTeacherReports);

router.get("/:id", verifyToken, getTeacherById);

export default router;