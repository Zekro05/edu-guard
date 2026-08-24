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

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search using the studentId string stored in both User and Student
    const student = await Student.findOne({
      studentId: id,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
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

    res.status(201).json(student);
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);
    res.status(400).json({ message: "Failed to create student" });
  }
};

/*  UPDATE STUDENT  */
export const updateStudent = async (req, res) => {
  try {
    // User who is performing the update
    const currentUser = await User.findById(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "Current user not found",
      });
    }

    const studentId = req.params.id;

    // =========================================================
    // FIND STUDENT
    // =========================================================

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // =========================================================
    // HANDLE PROFILE PHOTO
    // =========================================================

    let profilePhoto = student.profilePhoto;

    if (req.file) {
      profilePhoto = req.file.path;

      console.log("📸 NEW PROFILE PHOTO:", profilePhoto);
    }

    // =========================================================
    // UPDATE STUDENT COLLECTION
    // =========================================================

    const updatedData = {
      ...req.body,
      profilePhoto,
    };

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    // =========================================================
    // UPDATE CORRESPONDING USER COLLECTION
    // =========================================================

    const studentUser = await User.findOne({
      studentId: student.studentId,
    });

    if (studentUser) {
      studentUser.profilePhoto = profilePhoto;

      await studentUser.save();

      console.log(
        "✅ USER PROFILE PHOTO UPDATED:",
        studentUser.profilePhoto
      );
    } else {
      console.warn(
        `⚠️ No User account found for studentId: ${student.studentId}`
      );
    }

    // =========================================================
    // HISTORY LOG
    // =========================================================

    await createHistoryLog({
      userId: currentUser._id,
      role: mapRoleForHistory(currentUser.role),
      action: "Update Student Details",
      category: "Student",
      details: `Student details updated: (Student ID: ${student.studentId})`,
      ipAddress: req.ip,
    });

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
      profilePhoto,
    });

  } catch (error) {
    console.error("Failed to update student:", error);

    return res.status(400).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      firstName,
      middleName,
      lastName,
      phone,
    } = req.body;

    // =========================================================
    // FIND LOGGED-IN USER
    // =========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // =========================================================
    // MAKE SURE USER IS A STUDENT
    // =========================================================

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can update their profile.",
      });
    }

    // =========================================================
    // FIND STUDENT RECORD
    // =========================================================

    const student = await Student.findOne({
      studentId: user.studentId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // =========================================================
    // VALIDATION
    // =========================================================

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

    // =========================================================
    // UPDATE
    // =========================================================

    student.firstName = firstName.trim();

    student.middleName =
      middleName?.trim() || "";

    student.lastName =
      lastName.trim();

    student.phone =
      phone?.trim() || "";

    await student.save();

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",

      student: {
        _id: student._id,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        studentId: student.studentId,
        grade: student.grade,
        email: student.email,
        phone: student.phone,
        profilePhoto: student.profilePhoto,
        riskLevel: student.riskLevel,
      },
    });

  } catch (error) {
    console.error(
      "UPDATE MY PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

export const updateMyProfilePhoto = async (req, res) => {
  try {
    const userId = req.user._id;

    // =========================================================
    // FIND USER
    // =========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // =========================================================
    // CHECK ROLE
    // =========================================================

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can update their profile photo.",
      });
    }

    // =========================================================
    // FIND STUDENT
    // =========================================================

    const student = await Student.findOne({
      studentId: user.studentId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // =========================================================
    // CHECK FILE
    // =========================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required.",
      });
    }

    // Cloudinary URL
    student.profilePhoto = req.file.path;

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profilePhoto: student.profilePhoto,
    });
  } catch (error) {
    console.error(
      "UPDATE STUDENT PROFILE PHOTO ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update profile photo.",
      error: error.message,
    });
  }
};

export const createStudentsBulk = async (req, res) => {
  console.log("🔥 BULK ROUTE HIT");
  console.log("REQ BODY:", req.body);

  try {
    const user = await User.findById(req.userId);
    const students = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "Invalid student data" });
    }

    let inserted = 0;
    let updated = 0;
    let invalid = 0;

    const gradeMap = {
      "Grade 10": "Grade 11",
      "Grade 11": "Grade 12",
      "Grade 12": "Grade 12",
      "Grade12" : "Graduated"
    };

    for (const s of students) {
      if (!s.studentId) {
        invalid++;
        continue;
      }

      const existing = await Student.findOne({
        studentId: s.studentId.trim(),
      });

      // =========================
      // UPDATE FLOW (IMPORTANT FIX)
      // =========================
      if (existing) {
        const newGrade = gradeMap[s.grade || existing.grade] || existing.grade;

        const updatedStudent = await Student.findOneAndUpdate(
          { studentId: s.studentId.trim() },
          {
            $set: {
              // only update fields that exist in payload
              ...(s.firstName && { firstName: s.firstName }),
              ...(s.lastName && { lastName: s.lastName }),
              ...(s.middleName && { middleName: s.middleName }),
              ...(s.email && { email: s.email }),
              ...(s.phone && { phone: s.phone }),
              ...(s.gender && { gender: s.gender }),
              ...(s.riskLevel && { riskLevel: s.riskLevel }),

              grade: newGrade, // always update grade
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (updatedStudent) updated++;
        continue;
      }

      // =========================
      // INSERT FLOW (FULL DATA REQUIRED)
      // =========================
      if (!s.firstName || !s.lastName || !s.gender) {
        invalid++;
        continue;
      }

      await Student.create({
        studentId: s.studentId.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName || "",
        email: s.email || "",
        phone: s.phone || "",
        gender: s.gender,
        grade: s.grade || "Grade 10",
        riskLevel: s.riskLevel || "Low",
        createdBy: req.userId,
      });

      inserted++;
    }

    console.log("📊 FINAL RESULT:", { inserted, updated, invalid });

    await createHistoryLog({
      userId: user._id,
      role: mapRoleForHistory(user.role),
      action: "Bulk Upsert Students",
      category: "Student",
      details: `Inserted: ${inserted}, Updated: ${updated}, Invalid: ${invalid}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: "Bulk upsert completed",
      inserted,
      updated,
      invalid,
    });
  } catch (error) {
    console.error("BULK UPSERT ERROR:", error);
    return res.status(500).json({ message: "Failed bulk upsert" });
  }
};

export const previewBulkStudents = async (req, res) => {
  try {
    const students = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const result = {
      toInsert: [],
      toUpdate: [],
      invalid: [],
    };

    for (const s of students) {
      if (!s.studentId) {
        result.invalid.push({
          data: s,
          reason: "Missing studentId",
        });
        continue;
      }

      const existing = await Student.findOne({ studentId: s.studentId });

      if (existing) {
        result.toUpdate.push({
  studentId: s.studentId,
  name: `${existing.firstName} ${existing.lastName}`,
  oldGrade: existing.grade,
  newGrade: s.grade,
  email: s.email,
  phone: s.phone,
});
      } else {
        result.toInsert.push({
  studentId: s.studentId,
  name: `${s.firstName || ""} ${s.lastName || ""}`,
  grade: s.grade,
  email: s.email,
  phone: s.phone,
});
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Preview failed" });
  }
};

export const getStudentTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports, incidents, cases, interventions] = await Promise.all([
      Report.find({ studentId: id }),
      Incident.find({ studentId: id }),
      Case.find({ studentId: id }),
      Intervention.find({ studentId: id }),
    ]);

    const timeline = [
      ...reports.map(r => ({
        type: "REPORT",
        date: r.createdAt,
        data: r,
      })),

      ...incidents.map(i => ({
        type: "INCIDENT",
        date: i.createdAt,
        data: i,
      })),

      ...cases.map(c => ({
        type: "CASE",
        date: c.createdAt,
        data: c,
      })),

      ...interventions.map(i => ({
        type: "INTERVENTION",
        date: i.createdAt,
        data: i,
      })),
    ];

    // sort newest first
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    let excludeStudentId = null;

    // Find the currently logged-in user's Student record
    if (req.userId) {
      const currentUser = await User.findById(req.userId);

      if (currentUser?.role === "student" && currentUser.studentId) {
        const currentStudent = await Student.findOne({
          studentId: currentUser.studentId,
        });

        if (currentStudent) {
          excludeStudentId = currentStudent._id;
        }
      }
    }

    const searchFilter = {
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    // Exclude the currently logged-in student
    if (excludeStudentId) {
      searchFilter._id = { $ne: excludeStudentId };
    }

    const students = await Student.find(searchFilter)
      .select("_id firstName lastName email studentId")
      .limit(10);

    res.json(students);
  } catch (error) {
    console.error("SEARCH STUDENTS ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};
