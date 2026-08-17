import express from "express";
import {
  createTeacherReport,
  getTeacherReports,
  getTeacherById,
  updateMyTeacherProfile,
  updateMyTeacherProfilePhoto,
} from "../controllers/teacherController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { profileUpload } from "../middleware/upload.js";

const router = express.Router();

router.put("/profile", verifyToken, updateMyTeacherProfile);
router.put(
  "/profile/photo",
  verifyToken,
  profileUpload.single("profilePhoto"),
  updateMyTeacherProfilePhoto
);

router.post("/", verifyToken, createTeacherReport);

router.get("/my", verifyToken, getTeacherReports);

router.get("/:id", verifyToken, getTeacherById);

export default router;