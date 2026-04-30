import Student from "../models/studentModel.js";
import { User } from "../models/userModel.js";
import { createHistoryLog } from "../utils/createHistoryLog.js";
import { mapRoleForHistory } from "../utils/roleMapper.js";

/* GET ALL STUDENTS */
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

/*  CREATE STUDENT  */
export const createStudent = async (req, res) => {
  try {
    const profilePhoto = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "";

    const student = new Student({
      ...req.body,
      profilePhoto,
      createdBy: req.userId,
    });

    await student.save();

    io.emit("activity_feed", {
  type: "student",
  message: `👤 New student added: ${student.name}`,
  time: new Date(),
});

    res.status(201).json(student);
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);
    res.status(400).json({ message: "Failed to create student" });
  }
};

/*  UPDATE STUDENT  */
export const updateStudent = async (req, res) => {
  const user = await User.findById(req.userId);
  try {
    const studentId = req.params.id;

    // Find the existing student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Handle profile photo
    let profilePhoto = student.profilePhoto; // keep existing by default
    if (req.file) {
      profilePhoto = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // Prepare updated data
    const updatedData = {
      ...req.body,
      profilePhoto, // either new uploaded photo or existing
    };

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(studentId, updatedData, {
      new: true,
      runValidators: true,
    });

    await createHistoryLog({
          userId: user._id,
          role: mapRoleForHistory(user.role),
          action: "Update Student Details",
          category: "Student",
          details: `Student details updated: (Student ID: ${student.studentId})`,
          ipAddress: req.ip,
        });

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Failed to update student:", error);
    res.status(400).json({ message: "Failed to update student" });
  }
};

/*  DELETE STUDENT */
export const deleteStudent = async (req, res) => {
  const user = await User.findById(req.userId);
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await createHistoryLog({
          userId: user._id,
          role: mapRoleForHistory(user.role),
          action: "Update Student Details",
          category: "Student",
          details: `Student details deleted: (Student ID: ${student.studentId})`,
          ipAddress: req.ip,
        });

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student" });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) return res.json([]);

    const students = await Student.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id firstName lastName email")
      .limit(10);

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
