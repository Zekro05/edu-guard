import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
} from "../controllers/studentController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// PROTECTED ROUTES
router.get("/", verifyToken, getStudents);
router.post("/", verifyToken, upload.single("profilePhoto"), createStudent);
router.put("/:id", verifyToken, upload.single("profilePhoto"), updateStudent);
router.delete("/:id", verifyToken, deleteStudent);
router.get("/search", searchStudents);


export default router;
