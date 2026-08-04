import Report from "../models/reportModel.js";
import Teacher from "../models/teacherModel.js";
import { createHistoryLog } from "../utils/createHistoryLog.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";


/* ================= GET TEACHER PROFILE ================= */
export const getTeacherByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const teacher = await Teacher.findOne({ employeeId });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    res.status(200).json(teacher);
  } catch (err) {
    console.error("Get Teacher Error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
/* ================= CREATE REPORT (TEACHER) ================= */
export const createTeacherReport = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
    } = req.body;

    if (!studentId || !studentName || !description || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const teacher = await Teacher.findOne({ createdBy: req.userId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const report = await Report.create({
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,

      reporter: `${teacher.firstName} ${teacher.lastName}`,
      reporterId: req.userId,
      reporterType: "teacher",
    });

    await createHistoryLog({
      userId: req.userId,
      role: mapRoleForHistory("teacher"),
      action: "Create Report",
      category: "Report",
      details: `Teacher submitted a report for ${studentName}`,
      ipAddress: req.ip,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error("Teacher Report Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET MY REPORTS (TEACHER) ================= */
export const getTeacherReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reporterId: req.userId,
      reporterType: "teacher",
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Get Teacher Reports Error:", err);
    res.status(500).json({ message: err.message });
  }
};