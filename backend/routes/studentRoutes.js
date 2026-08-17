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
  getStudentById,
  updateMyProfile,
  updateMyProfilePhoto
} from "../controllers/studentController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.put("/profile", verifyToken, updateMyProfile);

// PROTECTED ROUTES
router.get("/search", searchStudents);
router.get("/", verifyToken, getStudents);
router.post("/", verifyToken, upload.single("profilePhoto"), createStudent);
router.get("/:id", verifyToken, getStudentById);
router.post("/bulk", verifyToken, createStudentsBulk);
router.post("/bulk/preview",verifyToken, previewBulkStudents);
router.put("/:id", verifyToken, upload.single("profilePhoto"), updateStudent);
router.put(
  "/profile/photo",
  verifyToken,
  upload.single("profilePhoto"),
  updateMyProfilePhoto
);
router.delete("/:id", verifyToken, deleteStudent);



export default router;
