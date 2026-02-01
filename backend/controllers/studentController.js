import Student from "../models/studentModel.js";

/* ================= GET ALL STUDENTS ================= */
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

/* ================= CREATE STUDENT ================= */
export const createStudent = async (req, res) => {
  try {
    const student = new Student({
      ...req.body,
      createdBy: req.userId
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);
    res.status(400).json({ message: "Failed to create student" });
  }
};

/* ================= UPDATE STUDENT ================= */
export const updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: "Failed to update student" });
  }
};

/* ================= DELETE STUDENT ================= */
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student" });
  }
};
