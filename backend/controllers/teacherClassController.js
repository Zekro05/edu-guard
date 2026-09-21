import TeacherClassRoster from "../models/teacherClassModel.js";
import Student from "../models/studentModel.js";
import Incident from "../models/incidentModel.js";
import Intervention from "../models/interventionModel.js";
import { User } from "../models/userModel.js";

/* =========================================================
   GET AUTHENTICATED TEACHER
========================================================= */

const getTeacher = async (req) => {
  const userId = req.userId || req.user?._id;

  if (!userId) {
    return null;
  }

  const user = await User.findById(userId)
    .select("_id role")
    .lean();

  if (!user) {
    return null;
  }

  if (String(user.role).toLowerCase() !== "teacher") {
    return null;
  }

  return user;
};

/* =========================================================
   NORMALIZE STUDENT NUMBERS
========================================================= */

const normalizeStudentIds = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
};

/* =========================================================
   GET TEACHER CLASS
========================================================= */

export const getTeacherClass = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Only teacher accounts can access My Class.",
      });
    }

    const roster = await TeacherClassRoster.findOne({
      teacherId: teacher._id,
    }).lean();

    if (!roster || !roster.studentIds?.length) {
      return res.json({
        success: true,
        students: [],
        count: 0,
      });
    }

    const [students, incidents, interventions] =
      await Promise.all([
        /* =====================================================
           STUDENTS
        ===================================================== */

        Student.find({
          _id: {
            $in: roster.studentIds,
          },
        })
          .select(
            [
              "_id",
              "studentId",
              "firstName",
              "middleName",
              "lastName",
              "email",
              "phone",
              "grade",
              "section",
              "gender",
              "profilePhoto",
              "riskLevel",
              "totalIncidents",
              "notes",
            ].join(" "),
          )
          .lean(),

        /* =====================================================
           INCIDENT HISTORY
        ===================================================== */

        Incident.find({
          studentId: {
            $in: roster.studentIds,
          },
        })
          .sort({
            createdAt: -1,
          })
          .lean(),

        /* =====================================================
           INTERVENTION HISTORY
        ===================================================== */

        Intervention.find({
          studentId: {
            $in: roster.studentIds,
          },
        })
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

    /* =========================================================
       GROUP INCIDENTS BY STUDENT
    ========================================================= */

    const incidentsByStudent = new Map();

    for (const incident of incidents) {
      const key = String(incident.studentId);

      if (!incidentsByStudent.has(key)) {
        incidentsByStudent.set(key, []);
      }

      incidentsByStudent.get(key).push(incident);
    }

    /* =========================================================
       GROUP INTERVENTIONS BY STUDENT
    ========================================================= */

    const interventionsByStudent = new Map();

    for (const intervention of interventions) {
      const key = String(intervention.studentId);

      if (!interventionsByStudent.has(key)) {
        interventionsByStudent.set(key, []);
      }

      interventionsByStudent
        .get(key)
        .push(intervention);
    }

    /* =========================================================
       PRESERVE ROSTER ORDER
    ========================================================= */

    const orderedStudents = roster.studentIds
      .map((studentObjectId) => {
        return students.find(
          (student) =>
            String(student._id) ===
            String(studentObjectId),
        );
      })
      .filter(Boolean)
      .map((student) => ({
        ...student,

        incidents:
          incidentsByStudent.get(
            String(student._id),
          ) || [],

        interventions:
          interventionsByStudent.get(
            String(student._id),
          ) || [],
      }));

    return res.json({
      success: true,
      students: orderedStudents,
      count: orderedStudents.length,
    });
  } catch (error) {
    console.error(
      "GET TEACHER CLASS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load teacher class.",
    });
  }
};

/* =========================================================
   IMPORT TEACHER CLASS
========================================================= */

export const importTeacherClass = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message:
          "Only teacher accounts can import a class roster.",
      });
    }

    const incomingIds = normalizeStudentIds(
      req.body?.studentIds,
    );

    /* =====================================================
       EMPTY IMPORT
    ===================================================== */

    if (!incomingIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "At least one student ID is required.",
      });
    }

    /* =====================================================
       CLASS SIZE LIMIT
    ===================================================== */

    if (incomingIds.length > 500) {
      return res.status(400).json({
        success: false,
        message:
          "A class import cannot contain more than 500 students.",
      });
    }

    /* =====================================================
       DUPLICATE VALIDATION
       DO THIS BEFORE USING SET
    ===================================================== */

    const seen = new Set();
    const duplicateStudentIds = [];

    for (const studentId of incomingIds) {
      if (seen.has(studentId)) {
        duplicateStudentIds.push(studentId);
      }

      seen.add(studentId);
    }

    if (duplicateStudentIds.length) {
      const uniqueDuplicates = [
        ...new Set(duplicateStudentIds),
      ];

      return res.status(400).json({
        success: false,
        code: "DUPLICATE_STUDENT_IDS",
        message:
          "Import rejected. Duplicate student IDs were found.",
        duplicateStudentIds: uniqueDuplicates,
      });
    }

    /* =====================================================
       FIND EXISTING STUDENTS

       IMPORTANT:
       incomingIds are Student.studentId values.

       Example:
       "1239863"

       NOT MongoDB _id.
    ===================================================== */

    const students = await Student.find({
      studentId: {
        $in: incomingIds,
      },
    })
      .select(
        [
          "_id",
          "studentId",
          "firstName",
          "middleName",
          "lastName",
          "email",
          "phone",
          "grade",
          "section",
          "gender",
          "profilePhoto",
          "riskLevel",
          "totalIncidents",
          "notes",
        ].join(" "),
      )
      .lean();

    /* =====================================================
       MAP DATABASE STUDENTS BY SCHOOL STUDENT NUMBER
    ===================================================== */

    const foundByStudentNumber = new Map();

    for (const student of students) {
      foundByStudentNumber.set(
        String(student.studentId).trim(),
        student,
      );
    }

    /* =====================================================
       FIND STUDENTS THAT DON'T EXIST
    ===================================================== */

    const missingStudentIds = incomingIds.filter(
      (studentId) =>
        !foundByStudentNumber.has(studentId),
    );

    if (missingStudentIds.length) {
      return res.status(400).json({
        success: false,
        code: "STUDENTS_NOT_FOUND",
        message:
          "Import rejected. One or more student IDs do not exist in the database.",
        missingStudentIds,
      });
    }

    /* =====================================================
       CONVERT SCHOOL IDs → MONGODB STUDENT OBJECTIDS
    ===================================================== */

    const orderedStudentObjectIds = incomingIds.map(
      (studentId) =>
        foundByStudentNumber.get(studentId)._id,
    );

    /* =====================================================
       GET EXISTING ROSTER
    ===================================================== */

    const existingRoster =
      await TeacherClassRoster.findOne({
        teacherId: teacher._id,
      }).lean();

    /* =====================================================
       SAVE / REPLACE TEACHER ROSTER

       IMPORTANT:
       This does NOT modify Student documents.
    ===================================================== */

    await TeacherClassRoster.findOneAndUpdate(
      {
        teacherId: teacher._id,
      },
      {
        $set: {
          studentIds: orderedStudentObjectIds,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      success: true,
      message:
        "Class roster validated and saved.",

      count: orderedStudentObjectIds.length,

      replacedExistingRoster:
        Boolean(existingRoster),

      students,
    });
  } catch (error) {
    console.error(
      "IMPORT TEACHER CLASS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to import teacher class.",
    });
  }
};

/* =========================================================
   REMOVE STUDENTS FROM TEACHER CLASS
========================================================= */

export const removeStudentsFromTeacherClass = async (
  req,
  res,
) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message:
          "Only teacher accounts can modify My Class.",
      });
    }

    const studentObjectIds =
      Array.isArray(req.body?.studentIds)
        ? req.body.studentIds
        : [];

    /* =====================================================
       VALIDATE REQUEST
    ===================================================== */

    if (!studentObjectIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "No students were selected for removal.",
      });
    }

    /* =====================================================
       REMOVE DUPLICATES FROM REQUEST
    ===================================================== */

    const uniqueStudentObjectIds = [
      ...new Set(
        studentObjectIds
          .map((id) => String(id).trim())
          .filter(Boolean),
      ),
    ];

    /* =====================================================
       FIND TEACHER ROSTER
    ===================================================== */

    const roster =
      await TeacherClassRoster.findOne({
        teacherId: teacher._id,
      });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message:
          "You do not have a class roster yet.",
      });
    }

    /* =====================================================
       SECURITY CHECK

       Make sure every selected student actually belongs
       to THIS teacher's roster.

       A teacher cannot remove students from another
       teacher's roster.
    ===================================================== */

    const rosterStudentIds =
      roster.studentIds.map(String);

    const unauthorizedStudentIds =
      uniqueStudentObjectIds.filter(
        (studentId) =>
          !rosterStudentIds.includes(studentId),
      );

    if (unauthorizedStudentIds.length) {
      return res.status(403).json({
        success: false,
        code: "STUDENTS_NOT_IN_ROSTER",
        message:
          "One or more selected students are not part of your class roster.",
        studentIds:
          unauthorizedStudentIds,
      });
    }

    /* =====================================================
       REMOVE ONLY FROM TEACHER ROSTER

       NEVER DELETE FROM Student COLLECTION.
    ===================================================== */

    roster.studentIds =
      roster.studentIds.filter(
        (studentId) =>
          !uniqueStudentObjectIds.includes(
            String(studentId),
          ),
      );

    await roster.save();

    return res.json({
      success: true,
      message:
        uniqueStudentObjectIds.length === 1
          ? "Student removed from My Class."
          : `${uniqueStudentObjectIds.length} students removed from My Class.`,

      removedCount:
        uniqueStudentObjectIds.length,

      remainingCount:
        roster.studentIds.length,
    });
  } catch (error) {
    console.error(
      "REMOVE STUDENTS FROM TEACHER CLASS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove students from My Class.",
    });
  }
};