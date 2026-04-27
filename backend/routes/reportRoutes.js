import express from "express";
import Report from "../models/Report.js";
import { io } from "../server.js";

const router = express.Router();

// CREATE REPORT (from mobile)
router.post("/", async (req, res) => {
  const report = await Report.create(req.body);

  io.emit("new-report", report); // 🔥 real-time

  res.json(report);
});

// GET reports (search + pagination)
router.get("/", async (req, res) => {
  const { page = 1, limit = 5, status, search } = req.query;

  let query = {};

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: "i" } },
      { offense: { $regex: search, $options: "i" } }
    ];
  }

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Report.countDocuments(query);

  res.json({
    reports,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page)
  });
});

// ACCEPT
router.put("/:id/accept", async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: "accepted" },
    { new: true }
  );

  io.emit("update-report", report); // 🔥 real-time

  res.json(report);
});

// REJECT
router.put("/:id/reject", async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );

  io.emit("update-report", report);

  res.json(report);
});

router.get("/my", verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });

    const reports = await Report.find({
      studentId: student._id,
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



export default router;