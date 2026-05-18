import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ================= UPLOAD FILES ================= */
router.post("/", upload.array("evidence", 5), (req, res) => {
  try {
    const files = req.files || [];

    const uploaded = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith("image/") ? "image" : "file",
      uploadedAt: new Date(),
    }));

    return res.status(200).json(uploaded);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;