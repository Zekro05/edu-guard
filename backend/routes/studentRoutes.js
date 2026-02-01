import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const router = express.Router();

// PROTECTED ROUTES
router.get("/", verifyToken, getStudents);
router.post("/", verifyToken, createStudent);
router.put("/:id", verifyToken, updateStudent);
router.delete("/:id", verifyToken, deleteStudent);

export default router;
