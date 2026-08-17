import Report from "../models/reportModel.js";
import Teacher from "../models/teacherModel.js";
import { createHistoryLog } from "../utils/createHistoryLog.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";


/* ================= GET TEACHER PROFILE ================= */
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search using the employeeId string stored in both User and Teacher
    const teacher = await Teacher.findOne({
      employeeId: id,
    });

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    return res.status(200).json(teacher);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
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

export const updateMyTeacherProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstName,
      middleName,
      lastName,
      phone,
    } = req.body;

    // Find logged-in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Only teachers can use this route
    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only teachers can update their profile.",
      });
    }

    // Find teacher record
    const teacher = await Teacher.findOne({
      employeeId: user.employeeId,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher record not found.",
      });
    }

    // Validation
    if (!firstName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Last name is required.",
      });
    }

    // Update teacher information
    teacher.firstName = firstName.trim();
    teacher.middleName = middleName?.trim() || "";
    teacher.lastName = lastName.trim();
    teacher.phone = phone?.trim() || "";

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully.",
      teacher: {
        _id: teacher._id,
        firstName: teacher.firstName,
        middleName: teacher.middleName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
        department: teacher.department,
        email: teacher.email,
        phone: teacher.phone,
        profilePhoto: teacher.profilePhoto,
        riskLevel: teacher.riskLevel,
      },
    });

  } catch (error) {
    console.error("UPDATE MY TEACHER PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update teacher profile.",
      error: error.message,
    });
  }
};