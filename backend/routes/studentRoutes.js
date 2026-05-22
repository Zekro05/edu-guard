import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  createStudentsBulk,
  previewBulkStudents,
  searchStudents,
} from "../controllers/studentController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// PROTECTED ROUTES
router.get("/search", searchStudents);
router.get("/", verifyToken, getStudents);
router.post("/", verifyToken, upload.single("profilePhoto"), createStudent);
router.post("/bulk", verifyToken, createStudentsBulk);
router.post("/bulk/preview",verifyToken, previewBulkStudents);
router.put("/:id", verifyToken, upload.single("profilePhoto"), updateStudent);
router.delete("/:id", verifyToken, deleteStudent);



export default router;
